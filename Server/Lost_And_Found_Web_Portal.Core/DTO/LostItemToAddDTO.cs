using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.DTO
{
    public class LostItemToAddDTO
    {
        [Required, MaxLength(120)]
        public string? Type { get; set; }

        [Required, MaxLength(80)]
        public string? Brand { get; set; }


        [Required, MaxLength(40)]
        public string? Color { get; set; }

        [MaxLength(500)]
        public string? Marks { get; set; }

        [Required, MaxLength(200)]
        public string? Place { get; set; }

        [Column(TypeName = "date")]
        [Required]
        public DateTime? Date { get; set; }

        [Column(TypeName = "decimal(9,6)")]
        [Required]
        public decimal? Latitude { get; set; }

        [Column(TypeName = "decimal(9,6)")]
        [Required]
        public decimal? Longitude { get; set; }

        public string? PhotoBase64 { get; set; }

        public LostItem ToLostItemEntity()
        {
            return new LostItem
            {
                Id = Guid.NewGuid(),
                Type = this.Type,
                Brand = this.Brand,
                Color = this.Color,
                Marks = this.Marks,
                Place = this.Place,
                Date = this.Date,
                Latitude = this.Latitude,
                Longitude = this.Longitude,
                PhotoUrl = this.PhotoBase64,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
        }

    };

}    
