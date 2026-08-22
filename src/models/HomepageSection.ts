import mongoose from 'mongoose';

const HomepageSectionSchema = new mongoose.Schema({
  sectionType: {
    type: String,
    required: true,
    enum: ['CuratedGrid', 'FeatureBanner', 'SplitShowcase', 'LookbookCarousel', 'CoutureProcess', 'JewelleryProcess', 'CategoryNavigation', 'BrandStory']
  },
  page: {
    type: String,
    default: 'home'
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true });

HomepageSectionSchema.index({ sectionType: 1, page: 1 }, { unique: true });

const HomepageSection = mongoose.models.HomepageSection || mongoose.model('HomepageSection', HomepageSectionSchema);
export default HomepageSection;
