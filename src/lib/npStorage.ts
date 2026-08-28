import fs from 'fs';
import path from 'path';

export function saveUserNpPhoto(userId: string, dataUrl: string): void {
  const usrnpDir = path.join(process.cwd(), 'usrnp');
  if (!fs.existsSync(usrnpDir)) {
    fs.mkdirSync(usrnpDir, { recursive: true });
  }

  const filePath = path.join(usrnpDir, `${userId}.np`);
  fs.writeFileSync(filePath, dataUrl, 'utf-8');
}

export function getUserNpPhoto(userId: string): string | null {
  const filePath = path.join(process.cwd(), 'usrnp', `${userId}.np`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

export function userNpExists(userId: string): boolean {
  const filePath = path.join(process.cwd(), 'usrnp', `${userId}.np`);
  return fs.existsSync(filePath);
}
