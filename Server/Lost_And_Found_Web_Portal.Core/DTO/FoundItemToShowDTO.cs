using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using Lost_And_Found_Web_Portal.Core.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.DTO
{
    public class FoundItemToShowDTO
    {
        public Guid Id { get; set; }
        public string? Type { get; set; }
        public string? Place { get; set; }
        public DateTime? FoundDate { get; set; }

        public string? Brand { get; set; }
        public string? Color { get; set; }
        public string? Detail { get; set; }

        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }

        public string? Status { get; set; }

        public string? OwnerId { get; set; }
        public string? OwnerName { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}

public static class FoundItemToShowDTOExtensions
{
    public static FoundItemToShowDTO ToFoundItemToShowDTO(this FoundItem foundItem)
    {
        return new FoundItemToShowDTO
        {
            Id = foundItem.Id,
            Type = foundItem.Type,
            Place = foundItem.Place,
            FoundDate = foundItem.FoundDate,
            Brand = foundItem.Brand,
            Color = foundItem.Color,
            Detail = foundItem.Detail,
            Latitude = foundItem.Latitude,
            Longitude = foundItem.Longitude,
            Status = foundItem.Status,
            OwnerId = foundItem.OwnerId.ToString(),
            OwnerName = foundItem.OwnerName,
            CreatedAt = foundItem.CreatedAt
        };
    }
}
