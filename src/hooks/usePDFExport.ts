import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

interface Event {
  name: string;
  date: string;
  location: string;
}

interface Booth {
  id: string;
  status: string;
  company?: string;
}

interface BoothPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

interface UsePDFExportProps {
  containerRef: React.RefObject<HTMLDivElement>;
  selectedEvent: Event & { mapUrl: string };
  booths: Booth[];
  positions: BoothPosition[];
}

export const usePDFExport = ({ containerRef, selectedEvent, booths, positions }: UsePDFExportProps) => {
  const { toast } = useToast();

  const exportToPDF = async () => {
    toast({
      title: 'Экспорт в PDF',
      description: 'Загрузка карты...',
    });

    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      

      
      const mapImg = new Image();
      mapImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        mapImg.onload = () => resolve();
        mapImg.onerror = () => reject(new Error('Не удалось загрузить карту'));
        mapImg.src = selectedEvent.mapUrl;
      });
      
      const mapAspectRatio = mapImg.width / mapImg.height;
      const availableWidth = pageWidth - 20;
      const availableHeight = pageHeight - 40;
      
      let mapWidth = availableWidth;
      let mapHeight = mapWidth / mapAspectRatio;
      
      if (mapHeight > availableHeight) {
        mapHeight = availableHeight;
        mapWidth = mapHeight * mapAspectRatio;
      }
      
      const mapX = (pageWidth - mapWidth) / 2;
      const mapY = 30;
      
      const containerWidth = 2400;
      const containerHeight = 1200;
      const WEB_CONTAINER_ASPECT = containerWidth / containerHeight;
      const imageAspect = mapImg.width / mapImg.height;
      
      console.log('PDF Debug:', {
        imageSize: `${mapImg.width}x${mapImg.height}`,
        imageAspect: imageAspect.toFixed(3),
        containerAspect: WEB_CONTAINER_ASPECT.toFixed(3),
        containerSize: `${containerWidth}x${containerHeight}`,
      });
      let imageOffsetX = 0;
      let imageOffsetY = 0;
      let imageRenderWidth: number;
      let imageRenderHeight: number;
      
      if (imageAspect > WEB_CONTAINER_ASPECT) {
        imageRenderWidth = containerWidth;
        imageRenderHeight = containerWidth / imageAspect;
        imageOffsetY = (containerHeight - imageRenderHeight) / 2;
        console.log('Mode: letterbox top/bottom', { imageOffsetY: imageOffsetY.toFixed(1) });
      } else {
        imageRenderHeight = containerHeight;
        imageRenderWidth = containerHeight * imageAspect;
        imageOffsetX = (containerWidth - imageRenderWidth) / 2;
        console.log('Mode: letterbox left/right', { imageOffsetX: imageOffsetX.toFixed(1) });
      }
      
      const scaleX = mapImg.width / imageRenderWidth;
      const scaleY = mapImg.height / imageRenderHeight;
      
      console.log('Scale:', { scaleX: scaleX.toFixed(3), scaleY: scaleY.toFixed(3) });
      
      const canvas = document.createElement('canvas');
      canvas.width = mapImg.width;
      canvas.height = mapImg.height;
      const ctx = canvas.getContext('2d')!;
      
      ctx.drawImage(mapImg, 0, 0);
      
      const headerFontSize = Math.max(40, mapImg.width / 60);
      const subHeaderFontSize = Math.max(24, mapImg.width / 100);
      const headerY = Math.max(60, mapImg.height / 20);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(0, 0, mapImg.width, headerY + 40);
      
      ctx.fillStyle = '#000';
      ctx.font = `bold ${headerFontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(selectedEvent.name, mapImg.width / 2, 20);
      
      ctx.fillStyle = '#666';
      ctx.font = `${subHeaderFontSize}px Arial`;
      ctx.fillText(`${selectedEvent.date} • ${selectedEvent.location}`, mapImg.width / 2, headerY);
      
      positions.forEach(pos => {
        const booth = booths.find(b => b.id === pos.id);
        if (!booth) return;
        
        const webXPercent = pos.x / 100;
        const webYPercent = pos.y / 100;
        const webWPercent = pos.width / 100;
        const webHPercent = pos.height / 100;
        
        const webX = webXPercent * containerWidth;
        const webY = webYPercent * containerHeight;
        const webW = webWPercent * containerWidth;
        const webH = webHPercent * containerHeight;
        
        const imageX = webX - imageOffsetX;
        const imageY = webY - imageOffsetY;
        
        const x = imageX * scaleX;
        const y = imageY * scaleY;
        const w = webW * scaleX;
        const h = webH * scaleY;
        
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        const rotation = pos.rotation || 0;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
        
        if (booth.status === 'available') {
          ctx.fillStyle = 'rgb(22, 163, 74)';
        } else if (booth.status === 'booked') {
          ctx.fillStyle = 'rgb(220, 38, 38)';
        } else {
          ctx.fillStyle = 'rgba(100, 116, 139)';
        }
        
        const fontSize = Math.max(16, mapImg.width / 80);
        
        ctx.fillRect(x, y, w, h);
        
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(booth.id, centerX, centerY);
        
        ctx.restore();
      });
      
      const compositeImgData = canvas.toDataURL('image/jpeg', 0.85);
      pdf.addImage(compositeImgData, 'JPEG', mapX, 10, mapWidth, mapHeight);
      
      const bookedBooths = booths.filter(b => b.status === 'booked' && b.company);
      
      if (bookedBooths.length > 0) {
        pdf.addPage();
        
        const listDiv = document.createElement('div');
        listDiv.style.cssText = 'position: absolute; left: -9999px; width: 800px; padding: 20px; font-family: Arial, sans-serif; background: white;';
        listDiv.innerHTML = `
          <h2 style="font-size: 24px; margin: 0 0 20px 0; font-weight: bold; color: #000;">Забронированные стенды</h2>
          ${bookedBooths.map(booth => `<p style="font-size: 16px; margin: 8px 0; color: #000;">${booth.id} - ${booth.company}</p>`).join('')}
        `;
        document.body.appendChild(listDiv);
        
        const listCanvas = await html2canvas(listDiv, {
          scale: 2,
          backgroundColor: '#ffffff',
        });
        document.body.removeChild(listDiv);
        
        const listImgData = listCanvas.toDataURL('image/png');
        const listWidth = 200;
        const listHeight = (listCanvas.height * listWidth) / listCanvas.width;
        pdf.addImage(listImgData, 'PNG', 15, 20, listWidth, listHeight);
      }
      
      pdf.save(`${selectedEvent.name}_карта_стендов.pdf`);
      
      toast({
        title: 'PDF сохранен',
        description: 'Карта стендов успешно экспортирована',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать PDF',
        variant: 'destructive',
      });
    }
  };

  return { exportToPDF };
};