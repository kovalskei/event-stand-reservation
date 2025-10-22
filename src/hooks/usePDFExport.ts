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
      
      const headerDiv = document.createElement('div');
      headerDiv.style.cssText = 'position: absolute; left: -9999px; width: 800px; padding: 20px; font-family: Arial, sans-serif; background: white; text-align: center;';
      headerDiv.innerHTML = `
        <h1 style="font-size: 32px; margin: 0 0 10px 0; font-weight: bold; color: #000;">${selectedEvent.name}</h1>
        <p style="font-size: 18px; margin: 0; color: #666;">${selectedEvent.date} • ${selectedEvent.location}</p>
      `;
      document.body.appendChild(headerDiv);
      
      const headerCanvas = await html2canvas(headerDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      document.body.removeChild(headerDiv);
      
      const headerImgData = headerCanvas.toDataURL('image/png');
      const headerWidth = 200;
      const headerHeight = (headerCanvas.height * headerWidth) / headerCanvas.width;
      pdf.addImage(headerImgData, 'PNG', (pageWidth - headerWidth) / 2, 5, headerWidth, headerHeight);
      
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
      
      console.log('=== PDF Export Debug ===');
      console.log('Image actual size:', mapImg.width, 'x', mapImg.height);
      console.log('Image aspect:', mapImg.width / mapImg.height);
      console.log('Container aspect (web):', 1920 / 850);
      
      const canvas = document.createElement('canvas');
      canvas.width = mapImg.width;
      canvas.height = mapImg.height;
      const ctx = canvas.getContext('2d')!;
      
      ctx.drawImage(mapImg, 0, 0);
      
      positions.forEach(pos => {
        const booth = booths.find(b => b.id === pos.id);
        if (!booth) return;
        
        const x = (pos.x / 100) * mapImg.width;
        const y = (pos.y / 100) * mapImg.height;
        const w = (pos.width / 100) * mapImg.width;
        const h = (pos.height / 100) * mapImg.height;
        
        console.log(`Booth ${booth.id}: pos=${pos.x},${pos.y} size=${pos.width}x${pos.height}% → canvas=${Math.round(x)},${Math.round(y)} size=${Math.round(w)}x${Math.round(h)}px`);
        
        if (booth.status === 'booked') {
          ctx.fillStyle = 'rgba(22, 163, 74, 0.3)';
          ctx.strokeStyle = 'rgb(22, 163, 74)';
        } else {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.strokeStyle = 'rgb(59, 130, 246)';
        }
        
        const lineWidth = Math.max(2, mapImg.width / 600);
        const fontSize = Math.max(16, mapImg.width / 80);
        
        ctx.lineWidth = lineWidth;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = '#000';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(booth.id, x + w / 2, y + h / 2);
      });
      
      const compositeImgData = canvas.toDataURL('image/jpeg', 0.85);
      pdf.addImage(compositeImgData, 'JPEG', mapX, mapY, mapWidth, mapHeight);
      
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