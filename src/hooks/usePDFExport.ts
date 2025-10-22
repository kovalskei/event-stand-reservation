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
      
      const headerFontSize = Math.max(60, mapImg.width / 40);
      const subHeaderFontSize = Math.max(32, mapImg.width / 80);
      const headerY = Math.max(80, mapImg.height / 15);
      
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
      
      if (positions.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        positions.forEach(pos => {
          const webX = (pos.x / 100) * containerWidth - imageOffsetX;
          const webY = (pos.y / 100) * containerHeight - imageOffsetY;
          const webW = (pos.width / 100) * containerWidth;
          const webH = (pos.height / 100) * containerHeight;
          
          const x = webX * scaleX;
          const y = webY * scaleY;
          const w = webW * scaleX;
          const h = webH * scaleY;
          
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + w);
          maxY = Math.max(maxY, y + h);
        });
        
        const padding = 100;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(mapImg.width, maxX + padding);
        maxY = Math.min(mapImg.height, maxY + padding);
        
        const zoomWidth = maxX - minX;
        const zoomHeight = maxY - minY;
        
        if (zoomWidth > 0 && zoomHeight > 0) {
          const zoomCanvas = document.createElement('canvas');
          zoomCanvas.width = zoomWidth;
          zoomCanvas.height = zoomHeight;
          const zoomCtx = zoomCanvas.getContext('2d')!;
          
          zoomCtx.drawImage(canvas, minX, minY, zoomWidth, zoomHeight, 0, 0, zoomWidth, zoomHeight);
          
          pdf.addPage();
          
          const zoomAspect = zoomWidth / zoomHeight;
          let zoomPdfWidth = pageWidth - 20;
          let zoomPdfHeight = zoomPdfWidth / zoomAspect;
          
          if (zoomPdfHeight > pageHeight - 60) {
            zoomPdfHeight = pageHeight - 60;
            zoomPdfWidth = zoomPdfHeight * zoomAspect;
          }
          
          const zoomX = (pageWidth - zoomPdfWidth) / 2;
          const zoomY = 30;
          
          zoomCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          zoomCtx.fillRect(0, 0, zoomWidth, 80);
          
          zoomCtx.fillStyle = '#000';
          zoomCtx.font = 'bold 48px Arial';
          zoomCtx.textAlign = 'center';
          zoomCtx.fillText('Детальная схема стендов', zoomWidth / 2, 50);
          
          const zoomImgData = zoomCanvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(zoomImgData, 'JPEG', zoomX, zoomY, zoomPdfWidth, zoomPdfHeight);
        }
      }
      
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