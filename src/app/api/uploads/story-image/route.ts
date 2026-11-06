import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { sameOrigin, session } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json() as HandleUploadBody;
    // Only the admin may request a short-lived browser upload token. The Blob
    // service itself authenticates its completion callbacks with that token.
    if (body.type === 'blob.generate-client-token' && (!sameOrigin(request) || !await session())) {
      return Response.json({ error: 'No autorizado.' }, { status: 403 });
    }
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async pathname => {
        if (!pathname.startsWith('historias/')) throw new Error('Destino de imagen inválido.');
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        };
      },
    });
    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'No se pudo preparar la carga.' }, { status: 400 });
  }
}
