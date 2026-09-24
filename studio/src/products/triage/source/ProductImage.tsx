import type {ComponentProps} from 'react';
import {Img, staticFile} from 'remotion';

/** Same local website artwork, with Remotion waiting for image decoding. */
export default function ProductImage({src, ...props}: ComponentProps<typeof Img>) {
  return <Img {...props} src={src?.startsWith('/') ? staticFile(src.slice(1)) : src}/>;
}
