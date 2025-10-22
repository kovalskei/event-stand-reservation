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

      const mapContainer = document.createElement('div');
      mapContainer.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 2400px; height: 1200px; background: white;';
      
      const mapImg = document.createElement('img');
      mapImg.src = selectedEvent.mapUrl;
      mapImg.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
      mapContainer.appendChild(mapImg);
      
      positions.forEach(pos => {
        const booth = booths.find(b => b.id === pos.id);
        if (!booth) return;
        
        const boothDiv = document.createElement('div');
        boothDiv.style.cssText = `
          position: absolute;
          left: ${pos.x}%;
          top: ${pos.y}%;
          width: ${pos.width}%;
          height: ${pos.height}%;
          transform: rotate(${pos.rotation || 0}deg);
          transform-origin: center;
          border: 2px solid ${booth.status === 'booked' ? '#16a34a' : '#3b82f6'};
          background-color: ${booth.status === 'booked' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          color: #000;
        `;
        boothDiv.textContent = booth.id;
        mapContainer.appendChild(boothDiv);
      });
      
      document.body.appendChild(mapContainer);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const mapCanvas = await html2canvas(mapContainer, {
        scale: 1,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 2400,
        height: 1200,
      });
      
      document.body.removeChild(mapContainer);

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