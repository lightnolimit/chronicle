import { useState } from 'react';

interface VideoWindowProps {
  onSubmit: (content: string, type: string, name: string) => Promise<void>;
  onOpenWallet?: () => void;
  isWalletConnected?: boolean;
}

export function VideoWindow({ onSubmit, onOpenWallet, isWalletConnected }: VideoWindowProps) {
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [videoName, setVideoName] = useState('untitled');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setUploadedImage(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (!prompt || !uploadedImage) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGeneratedVideo('https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4');
    }, 1000);
  };

  const handleUpload = async () => {
    if (!generatedVideo) return;
    if (!isWalletConnected) {
      onOpenWallet?.();
      return;
    }
    setUploading(true);
    try {
      await onSubmit(generatedVideo, 'video', videoName);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  return (
    <div style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontFamily: 'ChicagoFLF', fontSize: '11px' }}>
          Upload Image
        </label>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {uploadedImage && (
          <img 
            src={`data:image/png;base64,${uploadedImage}`} 
            alt="Preview" 
            style={{ maxWidth: '150px', maxHeight: '100px', marginTop: '8px' }} 
          />
        )}
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontFamily: 'ChicagoFLF', fontSize: '11px' }}>
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the motion you want..."
          style={{ 
            width: '100%', 
            height: '60px', 
            fontFamily: 'Geneva', 
            fontSize: '11px',
            padding: '4px',
          }}
        />
      </div>

      <button 
        onClick={handleGenerate}
        disabled={!prompt || !uploadedImage || generating}
        style={{ 
          marginBottom: '12px',
          padding: '8px',
          fontFamily: 'ChicagoFLF',
          cursor: generating ? 'wait' : 'pointer',
        }}
      >
        {generating ? 'Generating...' : 'Generate Video'}
      </button>

      {generatedVideo && (
        <div style={{ flex: 1, marginBottom: '12px' }}>
          <video 
            src={generatedVideo} 
            controls 
            style={{ width: '100%', maxHeight: '180px' }}
          />
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontFamily: 'ChicagoFLF', fontSize: '11px' }}>
          Video Name
        </label>
        <input
          type="text"
          value={videoName}
          onChange={(e) => setVideoName(e.target.value)}
          style={{ width: '100%', padding: '4px', fontFamily: 'Geneva', fontSize: '11px' }}
        />
      </div>

      <button 
        onClick={handleUpload}
        disabled={!generatedVideo || uploading}
        className="submit-btn"
      >
        {uploading ? 'Uploading...' : 'Submit to Permaweb'}
      </button>
    </div>
  );
}