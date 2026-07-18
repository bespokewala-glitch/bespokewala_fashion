import mongoose from 'mongoose';

const HomepageSectionSchema = new mongoose.Schema({
  sectionType: {
    type: String,
    required: true,
    unique: true, // Only one document per section type
    enum: ['CuratedGrid', 'FeatureBanner', 'SplitShowcase', 'LookbookCarousel']
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true });

export default mongoose.models.HomepageSection || mongoose.model('HomepageSection', HomepageSectionSchema);
