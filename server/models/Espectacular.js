import mongoose from 'mongoose';

const SlideSchema = new mongoose.Schema({
  id: Number,
  subtitle: String,
  categoryClass: String,
  title: String,
  description: String,
  buttonText: String,
  image: String,
  link: String,
  backgroundColor: String,
  discount: String,
  className: String,
  titleClass: String
});

const BannerGroupSchema = new mongoose.Schema({
  id: Number,
  slides: [SlideSchema]
});

const EspectacularSchema = new mongoose.Schema({
  sectionStyle: {
    backgroundImage: String,
    backgroundRepeat: { type: String, default: 'no-repeat' },
    backgroundSize: { type: String, default: 'cover' },
    layout: { type: String, default: 'classic' }
  },
  slider: [SlideSchema],
  banners: [BannerGroupSchema]
}, { timestamps: true });

const Espectacular = mongoose.model('Espectacular', EspectacularSchema);
export default Espectacular 