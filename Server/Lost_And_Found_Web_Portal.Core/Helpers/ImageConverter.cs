using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using System.IO;

namespace Lost_And_Found_Web_Portal.Core.Helpers
{
    public class ImageConverter
    {
        public async Task<string> ConvertImageToBase64Async(string imagePath, string webRootPath)
        {
            try
            {
                string fullPath;

                if (imagePath.StartsWith("/"))
                {
                    string relativePath = imagePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                    fullPath = Path.Combine(webRootPath, relativePath);
                }
                else
                {
                    fullPath = imagePath;
                }

                if (!File.Exists(fullPath))
                {
                    throw new FileNotFoundException($"Image file not found at path: {fullPath}");
                }

                byte[] imageBytes = await File.ReadAllBytesAsync(fullPath);

                string base64String = Convert.ToBase64String(imageBytes);

                string extension = Path.GetExtension(fullPath).ToLowerInvariant();
                string mimeType = GetMimeType(extension);

                return $"data:{mimeType};base64,{base64String}";
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to convert image to Base64: {ex.Message}", ex);
            }
        }

        public async Task<string> ConvertImageToBase64Async(string imagePath, string webRootPath, bool includeDataUri = true)
        {
            try
            {
                string fullPath;

                if (imagePath.StartsWith("/"))
                {
                    string relativePath = imagePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                    fullPath = Path.Combine(webRootPath, relativePath);
                }
                else
                {
                    fullPath = imagePath;
                }

                if (!File.Exists(fullPath))
                {
                    throw new FileNotFoundException($"Image file not found at path: {fullPath}");
                }


                byte[] imageBytes = await File.ReadAllBytesAsync(fullPath);

                string base64String = Convert.ToBase64String(imageBytes);

                if (includeDataUri)
                {
                    string extension = Path.GetExtension(fullPath).ToLowerInvariant();
                    string mimeType = GetMimeType(extension);

                    return $"data:{mimeType};base64,{base64String}";
                }
                else
                {
                    return base64String;
                }
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to convert image to Base64: {ex.Message}", ex);
            }
        }

        private string GetMimeType(string fileExtension)
        {
            return fileExtension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".webp" => "image/webp",
                ".svg" => "image/svg+xml",
                ".ico" => "image/x-icon",
                _ => "image/jpeg" 
            };
        }

        public async Task<string> SaveBase64ImageAsync(string base64String, Guid itemId, string webRootPath)
        {
            string base64Data = base64String;
            if (base64String.Contains(","))
            {
                base64Data = base64String.Split(',')[1];
            }


            byte[] imageBytes = Convert.FromBase64String(base64Data);

            string imagesDirectory = Path.Combine(webRootPath, "LostItems", "Images");
            if (!Directory.Exists(imagesDirectory))
            {
                Directory.CreateDirectory(imagesDirectory);
            }

            string fileName = $"{itemId}_{DateTime.UtcNow:yyyyMMddHHmmss}.jpg";
            string filePath = Path.Combine(imagesDirectory, fileName);

            await File.WriteAllBytesAsync(filePath, imageBytes);

            return $"/LostItems/Images/{fileName}";
        }


        public async Task<string> SaveBase64ChatImageAsync(string base64String, Guid chatId, string webRootPath)
        {
            string base64Data = base64String;
            if (base64String.Contains(","))
            {
                base64Data = base64String.Split(',')[1];
            }


            byte[] imageBytes = Convert.FromBase64String(base64Data);

            string imagesDirectory = Path.Combine(webRootPath, "ChatImages", "Images");
            if (!Directory.Exists(imagesDirectory))
            {
                Directory.CreateDirectory(imagesDirectory);
            }

            string fileName = $"{chatId}_{DateTime.UtcNow:yyyyMMddHHmmss}.jpg";
            string filePath = Path.Combine(imagesDirectory, fileName);

            await File.WriteAllBytesAsync(filePath, imageBytes);

            return $"/ChatImages/Images/{fileName}";
        }
    }
}