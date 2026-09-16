/**
 * Helper para subir imágenes y GIFs a ImgBB vía API
 * Documentación oficial: https://api.imgbb.com/
 */
export async function uploadToImgBB(file: File): Promise<string> {
  const apiKey =
    process.env.NEXT_PUBLIC_IMGBB_API_KEY ||
    "93b0389e23fee3de3df2f6ae9d0f1c46";

  if (!file) {
    throw new Error("No se seleccionó ningún archivo.");
  }

  // Comprobar tamaño (ImgBB permite hasta 32MB)
  if (file.size > 32 * 1024 * 1024) {
    throw new Error("El archivo supera el límite de 32MB permitido por ImgBB.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Error en el servidor de ImgBB (${response.status})`);
  }

  const data = await response.json();

  if (data.success && data.data) {
    // Para GIFs animados, 'image.url' contiene el archivo original .gif sin convertir ni aplanar a PNG/JPG estático
    const directGifUrl =
      data.data.image?.url ||
      data.data.url ||
      data.data.display_url;

    return directGifUrl;
  } else {
    throw new Error(data.error?.message || "No se pudo subir la imagen a ImgBB");
  }
}
