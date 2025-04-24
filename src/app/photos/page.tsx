import { PhotoUploader } from '@/components/PhotoUploader';

export default function PhotosPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Обмін фото</h1>
      <PhotoUploader />
    </div>
  );
}