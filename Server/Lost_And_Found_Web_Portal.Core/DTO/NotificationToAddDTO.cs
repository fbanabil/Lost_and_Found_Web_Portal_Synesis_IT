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
    public class NotificationToAddDTO
    {
        [Required]
        public Guid FoundItemId { get; set; }

        [Required]
        public Guid NotificationReceiver { get; set; }

        [Required]
        public bool IsRead { get; set; }

        [Required]
        public string? Details { get; set; }

        public Notification ToNotification()
        {
            return new Notification
            {
                Id = Guid.NewGuid(),
                FoundItemId = this.FoundItemId,
                NotificationReceiver = this.NotificationReceiver,
                IsRead = this.IsRead,
                Details = this.Details,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}
