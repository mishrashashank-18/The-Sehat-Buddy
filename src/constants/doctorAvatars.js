import maleAvatarLocal from '../assets/images/avatar-male.png';
import femaleAvatarLocal from '../assets/images/avatar-female.jpg';

export const DEFAULT_DOCTOR_AVATARS = [
  {
    key: 'male_doctor',
    label: 'Male Doctor Avatar',
    gender: 'male',
    url: 'https://res.cloudinary.com/nehlbmp2/image/upload/v1792893957/sehatbuddy/avatars/default_doctor_male.png',
    localSrc: maleAvatarLocal,
    publicPath: '/avatars/avatar-male.png',
    description: 'Male doctor avatar with stethoscope & blue circular backdrop'
  },
  {
    key: 'female_doctor',
    label: 'Female Doctor Avatar',
    gender: 'female',
    url: 'https://res.cloudinary.com/nehlbmp2/image/upload/v1792893958/sehatbuddy/avatars/default_doctor_female.jpg',
    localSrc: femaleAvatarLocal,
    publicPath: '/avatars/avatar-female.jpg',
    description: 'Female doctor avatar in white coat with stethoscope'
  }
];

export const isPresetAvatar = (imageUrl) => {
  if (!imageUrl) return false;
  return DEFAULT_DOCTOR_AVATARS.some(av => 
    av.url === imageUrl || 
    av.localSrc === imageUrl || 
    av.publicPath === imageUrl ||
    (typeof imageUrl === 'string' && (
      imageUrl.includes('default_doctor_male') || 
      imageUrl.includes('default_doctor_female') || 
      imageUrl.includes('avatar-male') || 
      imageUrl.includes('avatar-female')
    ))
  );
};

export default DEFAULT_DOCTOR_AVATARS;
