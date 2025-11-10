using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using Lost_And_Found_Web_Portal.Core.DTO;
using Lost_And_Found_Web_Portal.Core.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.DTO
{
    public class LostItemToShowDTO
    {
        public Guid Id { get; set; }
        public string? Type { get; set; }
        public string? Brand { get; set; }
        public string? Color { get; set; }
        public string? Marks { get; set; }
        public string? Place { get; set; }
        public DateTime? Date { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? PhotoBase64 { get; set; }
        public string? Status { get; set; }
        public Guid? OwnerId { get; set; }
        public string? OwnerName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

public static class LostItemExtension
{ 
    public static LostItemToShowDTO ToLostItemToShow(this LostItem lostItem)
    {
        LostItemToShowDTO lostItemToShowDTO = new LostItemToShowDTO()
        {
            Id = lostItem.Id,
            Type = lostItem.Type,
            Brand = lostItem.Brand,
            Color = lostItem.Color,
            Marks = lostItem.Marks,
            Place = lostItem.Place,
            Date = lostItem.Date,
            Latitude = lostItem.Latitude,
            Longitude = lostItem.Longitude,
            PhotoBase64 = lostItem.PhotoUrl,
            Status = lostItem.Status,
            OwnerId = lostItem.OwnerId,
            OwnerName = lostItem.OwnerName,
            CreatedAt = lostItem.CreatedAt
        };
        return lostItemToShowDTO;
    }
}
