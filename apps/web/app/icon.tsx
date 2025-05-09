import { readFile } from 'fs/promises';
import { join } from 'path';

import { ImageResponse } from 'next/og';

// Icon sizes for different platforms
const sizes = {
  favicon: 32,
  appleTouch: 180,
  android: 192,
  pwa: 512,
};

// Image metadata
export const size = {
  width: sizes.favicon,
  height: sizes.favicon,
};
export const contentType = 'image/png';

// Image generation
export default async function Icon() {
  // Read the original icon file
  const iconPath = join(process.cwd(), 'public', 'spendflix-icon.png');
  const iconBuffer = await readFile(iconPath);
  const iconBase64 = `data:image/png;base64,${iconBuffer.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <img
          src={iconBase64}
          alt="Spendflix Icon"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  );
}
