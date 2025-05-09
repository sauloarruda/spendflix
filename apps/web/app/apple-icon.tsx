import { readFile } from 'fs/promises';
import { join } from 'path';

import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default async function AppleIcon() {
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
