using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.Domain.Entities
{
    public class Notification
    {
        [Key]
        [Required]
        public Guid Id { get; set; }

        [Required]
        public Guid FoundItemId { get; set; }

        [Required]
        public Guid NotificationReceiver { get; set; }

        [Required]
        [Column(TypeName = "bit")]
        public bool IsRead { get; set; }

        [Required]
        public string? Details { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }
    }
}
