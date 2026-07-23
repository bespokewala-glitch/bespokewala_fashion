import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Taxonomy from '@/models/Taxonomy';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const enabledOnly = searchParams.get('enabled') === 'true';
    const productType = searchParams.get('productType');
    const gender = searchParams.get('gender');

    const query: any = {};
    if (type) query.type = type;
    if (enabledOnly) query.enabled = true;
    
    // If productType is specified, find taxonomies where productTypes array is empty OR contains the productType
    if (productType) {
      query.$or = [
        { productTypes: { $exists: true, $size: 0 } },
        { productTypes: productType }
      ];
    }
    
    // If gender is specified, find taxonomies where genders array is empty OR contains the gender
    if (gender) {
      const genderCondition = [
        { genders: { $exists: true, $size: 0 } },
        { genders: gender }
      ];
      
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: genderCondition }];
        delete query.$or;
      } else {
        query.$or = genderCondition;
      }
    }

    const taxonomies = await Taxonomy.find(query).sort({ order: 1, name: 1 });
    return NextResponse.json(taxonomies);
  } catch (error: any) {
    console.error('Error fetching taxonomies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();
    
    // Auto-generate slug if not provided
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const taxonomy = new Taxonomy(data);
    await taxonomy.save();
    return NextResponse.json(taxonomy, { status: 201 });
  } catch (error: any) {
    console.error('Error creating taxonomy:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A taxonomy with this slug already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
