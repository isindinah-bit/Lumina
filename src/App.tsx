/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Camera, 
  Briefcase, 
  Building2, 
  Sun, 
  ChevronRight, 
  Loader2, 
  Download, 
  RefreshCw,
  CheckCircle2,
  X
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface HeadshotStyle {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
  previewColor: string;
}

const STYLES: HeadshotStyle[] = [
  {
    id: 'corporate-grey',
    name: 'Corporate Studio',
    description: 'Classic grey backdrop, soft studio lighting.',
    icon: <Camera className="w-5 h-5" />,
    prompt: 'Transform this casual selfie into a professional corporate headshot. The person should be wearing formal business attire (suit or professional blouse). The background should be a clean, solid neutral grey studio backdrop with soft, professional three-point lighting. Maintain the person\'s facial features accurately but enhance the overall professional appearance.',
    previewColor: 'bg-zinc-600'
  },
  {
    id: 'tech-office',
    name: 'Modern Tech Office',
    description: 'Bright, blurred modern office environment.',
    icon: <Building2 className="w-5 h-5" />,
    prompt: 'Transform this casual selfie into a professional headshot for a tech professional. The person should be wearing smart-casual professional attire. The background should be a modern, bright office with glass walls and plants, slightly out of focus (bokeh effect). Lighting should be natural and clean.',
    previewColor: 'bg-blue-900/40'
  },
  {
    id: 'outdoor-natural',
    name: 'Outdoor Natural',
    description: 'Golden hour lighting in a park or urban setting.',
    icon: <Sun className="w-5 h-5" />,
    prompt: 'Transform this casual selfie into a professional outdoor headshot. The person should be wearing high-quality casual professional clothing. The background should be a beautiful park or a clean urban architectural setting during golden hour. Soft, warm natural sunlight should highlight the person\'s features.',
    previewColor: 'bg-orange-900/40'
  },
  {
    id: 'executive-dark',
    name: 'Executive Dark',
    description: 'Moody, high-contrast professional look.',
    icon: <Briefcase className="w-5 h-5" />,
    prompt: 'Transform this casual selfie into a high-end executive headshot. The person should be wearing premium formal business attire. The background should be dark and sophisticated, perhaps a mahogany-paneled library or a dark textured wall. High-contrast, dramatic professional lighting.',
    previewColor: 'bg-black'
  }
];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<HeadshotStyle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setResultImage(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      const url = URL.createObjectURL(droppedFile);
      setPreviewUrl(url);
      setResultImage(null);
      setError(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const generateHeadshot = async () => {
    if (!file || !selectedStyle) return;

    setIsGenerating(true);
    setError(null);

    try {
      const base64Data = await fileToBase64(file);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type,
              },
            },
            {
              text: selectedStyle.prompt,
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setResultImage(imageUrl);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("No image was generated. Please try again.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `lumina-headshot-${selectedStyle?.id || 'result'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setSelectedStyle(null);
    setResultImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <Camera className="w-5 h-5 text-black" />
          </div>
          <span className="font-serif text-xl tracking-tight">Lumina</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-white/60">
          <a href="#" className="hover:text-white transition-colors">How it works</a>
          <a href="#" className="hover:text-white transition-colors">Styles</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
        </nav>
        <button className="px-4 py-2 rounded-full border border-white/20 text-sm hover:bg-white hover:text-black transition-all">
          Sign In
        </button>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        {/* Hero Section */}
        {!file && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
              Professional headshots <br />
              <span className="italic text-white/60">without the studio.</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto text-lg mb-10">
              Upload a simple selfie and let Lumina transform it into a 
              world-class professional headshot in seconds.
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Upload & Style Selection */}
          <div className={`${file ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-8`}>
            
            {/* Upload Area */}
            {!file ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-[400px] rounded-3xl border-2 border-dashed border-white/10 hover:border-white/30 transition-all cursor-pointer flex flex-col items-center justify-center bg-white/[0.02]"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-white/60" />
                </div>
                <h3 className="text-xl font-medium mb-2">Drop your selfie here</h3>
                <p className="text-white/40 text-sm">or click to browse files</p>
                
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-8">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 overflow-hidden">
                        <img 
                          src={`https://picsum.photos/seed/headshot${i}/100/100`} 
                          alt="User" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-60"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/30 flex items-center">
                    Joined by 2,000+ professionals
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 group">
                  <img 
                    src={previewUrl!} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={reset}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-white hover:text-black transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs font-medium uppercase tracking-widest text-white/60">Original Selfie</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium uppercase tracking-widest text-white/40">Select Style</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style)}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                          selectedStyle?.id === style.id 
                            ? 'bg-white text-black border-white' 
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedStyle?.id === style.id ? 'bg-black/10' : style.previewColor
                        }`}>
                          {style.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{style.name}</p>
                          <p className={`text-xs ${selectedStyle?.id === style.id ? 'text-black/60' : 'text-white/40'}`}>
                            {style.description}
                          </p>
                        </div>
                        {selectedStyle?.id === style.id && <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={!selectedStyle || isGenerating}
                  onClick={generateHeadshot}
                  className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    !selectedStyle || isGenerating
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Headshot
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </div>

          {/* Right Column: Result */}
          {file && (
            <div className="lg:col-span-7">
              <div className="sticky top-32">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="aspect-[4/5] rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center p-12 text-center"
                    >
                      <div className="relative w-24 h-24 mb-8">
                        <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin"></div>
                      </div>
                      <h3 className="text-2xl font-serif mb-4">Developing your photo...</h3>
                      <p className="text-white/40 max-w-xs">
                        Our AI is adjusting lighting, wardrobe, and background to create your perfect professional look.
                      </p>
                    </motion.div>
                  ) : resultImage ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-6"
                    >
                      <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/20 shadow-2xl shadow-white/5">
                        <img 
                          src={resultImage} 
                          alt="Result" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-6 left-6 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs font-medium tracking-widest uppercase">
                          Lumina AI Result
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={downloadImage}
                          className="flex-1 py-4 rounded-xl bg-white text-black font-medium flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                        >
                          <Download className="w-5 h-5" />
                          Download High-Res
                        </button>
                        <button
                          onClick={generateHeadshot}
                          className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                          title="Regenerate"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ) : error ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="aspect-[4/5] rounded-3xl bg-red-500/5 border border-red-500/20 flex flex-col items-center justify-center p-12 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                        <X className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="text-xl font-medium mb-2 text-red-500">Generation Failed</h3>
                      <p className="text-white/40 mb-8">{error}</p>
                      <button
                        onClick={generateHeadshot}
                        className="px-6 py-3 rounded-xl bg-white text-black font-medium"
                      >
                        Try Again
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="aspect-[4/5] rounded-3xl border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center p-12 text-center"
                    >
                      <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mb-8 opacity-20">
                        <Camera className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-serif text-white/20">Your result will appear here</h3>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Camera className="w-3 h-3 text-white" />
            </div>
            <span className="font-serif text-lg tracking-tight text-white/60">Lumina</span>
          </div>
          <p className="text-white/30 text-sm">
            © 2026 Lumina AI. Professional headshots for everyone.
          </p>
          <div className="flex gap-6 text-white/40 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
