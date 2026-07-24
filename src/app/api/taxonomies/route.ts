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
  let data: any;
  try {
    await dbConnect();
    data = await request.json();
    
    // Auto-generate slug if not provided
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const taxonomy = new Taxonomy(data);
    await taxonomy.save();
    return NextResponse.json(taxonomy, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      try {
        const slug = data.slug || (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : null);
        
        if (slug) {
          const existing = await Taxonomy.findOne({ type: data.type, slug });
          if (existing) {
            // Append the new productTypes and genders if they aren't already present
            let updated = false;
            if (data.productTypes && Array.isArray(data.productTypes)) {
              data.productTypes.forEach((pt: string) => {
                if (!existing.productTypes.includes(pt)) {
                  existing.productTypes.push(pt);
                  updated = true;
                }
              });
            }
            if (data.genders && Array.isArray(data.genders)) {
              data.genders.forEach((g: string) => {
                if (!existing.genders.includes(g)) {
                  existing.genders.push(g);
                  updated = true;
                }
              });
            }
            
            if (updated) {
              await existing.save();
            }
            
            return NextResponse.json(existing, { status: 200 });
          }
        }
      } catch (innerErr) {
        console.error('Error recovering from duplicate taxonomy:', innerErr);
      }
      return NextResponse.json({ error: 'A taxonomy with this name already exists and could not be linked.' }, { status: 400 });
    }
    console.error('Error creating taxonomy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
