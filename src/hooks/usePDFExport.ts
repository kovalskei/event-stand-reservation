import jsPDF from 'jspdf';
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
      
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedEvent.name, pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${selectedEvent.date} • ${selectedEvent.location}`, pageWidth / 2, 22, { align: 'center' });
      
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
      
      pdf.addImage(mapImg, 'JPEG', mapX, mapY, mapWidth, mapHeight, undefined, 'FAST');
      
      positions.forEach(pos => {
        const booth = booths.find(b => b.id === pos.id);
        if (!booth) return;
        
        const boothX = mapX + (pos.x / 100) * mapWidth;
        const boothY = mapY + (pos.y / 100) * mapHeight;
        const boothW = (pos.width / 100) * mapWidth;
        const boothH = (pos.height / 100) * mapHeight;
        
        if (booth.status === 'booked') {
          pdf.setFillColor(22, 163, 74, 0.3);
          pdf.setDrawColor(22, 163, 74);
        } else {
          pdf.setFillColor(59, 130, 246, 0.3);
          pdf.setDrawColor(59, 130, 246);
        }
        
        pdf.setLineWidth(0.5);
        pdf.rect(boothX, boothY, boothW, boothH, 'FD');
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(booth.id, boothX + boothW / 2, boothY + boothH / 2, { 
          align: 'center',
          baseline: 'middle'
        });
      });
      
      const bookedBooths = booths.filter(b => b.status === 'booked' && b.company);
      
      if (bookedBooths.length > 0) {
        pdf.addPage();
        
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Забронированные стенды', 15, 20);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        let yPos = 35;
        
        bookedBooths.forEach(booth => {
          if (yPos > pageHeight - 15) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(`${booth.id} - ${booth.company}`, 15, yPos);
          yPos += 7;
        });
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