using Lost_And_Found_Web_Portal.Core.Domain.IdentityEntities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.Domain.Entities
{
    public class LostItem
    {
        [Key]
        [Required]
        public Guid Id { get; set; }

        [Required, MaxLength(120)]
        public string? Type { get; set; }              

        [Required,MaxLength(80)]
        public string? Brand { get; set; }


        [Required,MaxLength(40)]
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


        [MaxLength(1000)]
        public string? PhotoUrl { get; set; }

        [Required, MaxLength(32)]
        public string Status { get; set; } = "Pending";

        [Required]
        public Guid? OwnerId { get; set; }
        
        [Required, MaxLength(200)]
        public string? OwnerName { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
