using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.DTO
{
    public class FilterAttributesDTO
    {
        [Required,MaxLength(100)]
        public string? ItemType { get; set; }

        [Required]
        public DateTime? DateOfLoss { get; set; }

        [Required]
        public decimal? Latitude { get; set; }

        [Required]
        public decimal? Longitude { get; set; }
    }
}
