import fs from "fs";
import path from "path";
import sharp from "sharp";

export async function convertPngToWebp(
  inputDir = "./images", 
  outputDir = "./webp",
  inputFile?: string,
  outputFile?: string
) {
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // If specific files are provided, convert only those
  if (inputFile && outputFile) {
    const inputPath = path.join(inputDir, inputFile);
    const outputPath = path.join(outputDir, outputFile);

    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);

    console.log(`Converted: ${inputFile} → ${outputPath}`);
    return;
  }

  // Otherwise, convert all PNG files in directory
  const files = fs.readdirSync(inputDir);

  for (const file of files) {
    if (file.endsWith(".png")) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file.replace(".png", ".webp"));

      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);

      console.log(`Converted: ${file} → ${outputPath}`);
    }
  }
}