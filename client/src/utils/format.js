import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatMessageTime(date) {
  return format(new Date(date), 'HH:mm');
}

export function formatMessageDate(date) {
  return format(new Date(date), 'dd MMMM yyyy', { locale: ru });
}

export function formatRelativeTime(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru });
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
