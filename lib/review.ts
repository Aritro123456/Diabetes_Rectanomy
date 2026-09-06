export function validateImageFile(file: { type: string; size: number }) {
 return ['image/jpeg', 'image/png'].includes(file.type) && file.size > 0 && file.size <= 10 * 1024 * 1024;
}
export function validateImageDimensions(width: number, height: number) {
 return width >= 32 && height >= 32 && width * height <= 40000000;
}
