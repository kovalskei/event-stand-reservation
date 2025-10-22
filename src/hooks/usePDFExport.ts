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

interface UsePDFExportProps {
  containerRef: React.RefObject<HTMLDivElement>;
  selectedEvent: Event;
  booths: Booth[];
}

export const usePDFExport = ({ containerRef, selectedEvent, booths }: UsePDFExportProps) => {
  const { toast } = useToast();

  const exportToPDF = async () => {
    const mapElement = containerRef.current;
    if (!mapElement) return;

    toast({
      title: 'Экспорт в PDF',
      description: 'Подготовка документа...',
    });

    try {
      const headerDiv = document.createElement('div');
      headerDiv.style.cssText = 'position: absolute; left: -9999px; width: 800px; padding: 20px; font-family: Arial, sans-serif; background: white;';
      headerDiv.innerHTML = `
        <h1 style="font-size: 32px; margin: 0 0 10px 0; text-align: center; font-weight: bold;">${selectedEvent.name}</h1>
        <p style="font-size: 18px; margin: 0; text-align: center; color: #666;">${selectedEvent.date} • ${selectedEvent.location}</p>
      `;
      document.body.appendChild(headerDiv);
      
      const headerCanvas = await html2canvas(headerDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      document.body.removeChild(headerDiv);

      const mapCanvas = await html2canvas(mapElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const headerImgData = headerCanvas.toDataURL('image/png');
      const headerWidth = 190;
      const headerHeight = (headerCanvas.height * headerWidth) / headerCanvas.width;
      pdf.addImage(headerImgData, 'PNG', 10, 10, headerWidth, headerHeight);
      
      const mapImgData = mapCanvas.toDataURL('image/jpeg', 0.7);
      const mapWidth = 190;
      const mapHeight = (mapCanvas.height * mapWidth) / mapCanvas.width;
      const mapYPosition = 10 + headerHeight + 5;
      pdf.addImage(mapImgData, 'JPEG', 10, mapYPosition, mapWidth, mapHeight);
      
      let yPosition = mapYPosition + mapHeight + 10;
      
      const bookedBooths = booths.filter(b => b.status === 'booked' && b.company);
      
      if (bookedBooths.length > 0) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 15;
        }
        
        const listDiv = document.createElement('div');
        listDiv.style.cssText = 'position: absolute; left: -9999px; width: 800px; padding: 10px; font-family: Arial, sans-serif; background: white;';
        listDiv.innerHTML = `
          <h2 style="font-size: 20px; margin: 0 0 10px 0; font-weight: bold;">Забронированные стенды:</h2>
          ${bookedBooths.map(booth => `<p style="font-size: 16px; margin: 5px 0;">${booth.id} - ${booth.company}</p>`).join('')}
        `;
        document.body.appendChild(listDiv);
        
        const listCanvas = await html2canvas(listDiv, {
          scale: 2,
          backgroundColor: '#ffffff',
        });
        document.body.removeChild(listDiv);
        
        const listImgData = listCanvas.toDataURL('image/png');
        const listWidth = 190;
        const listHeight = (listCanvas.height * listWidth) / listCanvas.width;
        
        if (yPosition + listHeight > 280) {
          pdf.addPage();
          yPosition = 15;
        }
        
        pdf.addImage(listImgData, 'PNG', 10, yPosition, listWidth, listHeight);
      }
      
      pdf.save(`${selectedEvent.name}_карта_стендов.pdf`);
      
      toast({
        title: 'PDF сохранен',
        description: 'Карта стендов успешно экспортирована',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать PDF',
        variant: 'destructive',
      });
    }
  };

  return { exportToPDF };
};