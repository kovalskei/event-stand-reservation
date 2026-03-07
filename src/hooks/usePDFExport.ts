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

      // Заголовок рисуем через jsPDF — не на canvas
      const HEADER_HEIGHT = 18; // мм
      const marginX = 10;
      const marginY = 5;

      // Заголовок
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      const titleLines = pdf.splitTextToSize(selectedEvent.name, pageWidth - marginX * 2);
      pdf.text(titleLines, pageWidth / 2, marginY + 7, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${selectedEvent.date} • ${selectedEvent.location}`, pageWidth / 2, marginY + 13, { align: 'center' });

      // Область карты — под заголовком
      const mapAreaY = marginY + HEADER_HEIGHT;
      const availableWidth = pageWidth - marginX * 2;
      const availableHeight = pageHeight - mapAreaY - 5;

      const mapAspectRatio = mapImg.width / mapImg.height;
      let mapWidth = availableWidth;
      let mapHeight = mapWidth / mapAspectRatio;
      if (mapHeight > availableHeight) {
        mapHeight = availableHeight;
        mapWidth = mapHeight * mapAspectRatio;
      }
      const mapX = (pageWidth - mapWidth) / 2;
      const mapY = mapAreaY;

      // Canvas — только карта + стенды, БЕЗ заголовка
      const containerWidth = 2400;
      const containerHeight = 1200;
      const WEB_CONTAINER_ASPECT = containerWidth / containerHeight;
      const imageAspect = mapImg.width / mapImg.height;

      let imageOffsetX = 0;
      let imageOffsetY = 0;
      let imageRenderWidth: number;
      let imageRenderHeight: number;

      if (imageAspect > WEB_CONTAINER_ASPECT) {
        imageRenderWidth = containerWidth;
        imageRenderHeight = containerWidth / imageAspect;
        imageOffsetY = (containerHeight - imageRenderHeight) / 2;
      } else {
        imageRenderHeight = containerHeight;
        imageRenderWidth = containerHeight * imageAspect;
        imageOffsetX = (containerWidth - imageRenderWidth) / 2;
      }

      const scaleX = mapImg.width / imageRenderWidth;
      const scaleY = mapImg.height / imageRenderHeight;

      const canvas = document.createElement('canvas');
      canvas.width = mapImg.width;
      canvas.height = mapImg.height;
      const ctx = canvas.getContext('2d')!;

      // Рисуем только саму карту
      ctx.drawImage(mapImg, 0, 0);

      // Рисуем стенды
      positions.forEach(pos => {
        const booth = booths.find(b => b.id === pos.id);
        if (!booth) return;

        const webX = (pos.x / 100) * containerWidth;
        const webY = (pos.y / 100) * containerHeight;
        const webW = (pos.width / 100) * containerWidth;
        const webH = (pos.height / 100) * containerHeight;

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

      const compositeImgData = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(compositeImgData, 'JPEG', mapX, mapY, mapWidth, mapHeight);

      // Страница 2 — детальная схема стендов
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

        const padding = 200;
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

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(13);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Детальная схема стендов', pageWidth / 2, marginY + 7, { align: 'center' });

          const zoomAspect = zoomWidth / zoomHeight;
          const zoomAreaY = marginY + HEADER_HEIGHT;
          let zoomPdfWidth = pageWidth - marginX * 2;
          let zoomPdfHeight = zoomPdfWidth / zoomAspect;
          if (zoomPdfHeight > pageHeight - zoomAreaY - 5) {
            zoomPdfHeight = pageHeight - zoomAreaY - 5;
            zoomPdfWidth = zoomPdfHeight * zoomAspect;
          }
          const zoomX = (pageWidth - zoomPdfWidth) / 2;

          const zoomImgData = zoomCanvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(zoomImgData, 'JPEG', zoomX, zoomAreaY, zoomPdfWidth, zoomPdfHeight);
        }
      }

      // Страница 3 — список забронированных
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
