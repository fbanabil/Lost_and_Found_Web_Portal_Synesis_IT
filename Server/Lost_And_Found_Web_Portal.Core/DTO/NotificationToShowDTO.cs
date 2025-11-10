using Lost_And_Found_Web_Portal.Core.DTO;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.DTO
{
    public class NotificationToShowDTO
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        public Guid FoundItemId { get; set; }

        [Required]
        public Guid NotificationReceiver { get; set; }

        [Required]
        public bool IsRead { get; set; }

        [Required]
        public string? Details { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }
    }
}

public static class NotificationExtension
{
    public static NotificationToShowDTO ToNotificationToShowDTO(this Lost_And_Found_Web_Portal.Core.Domain.Entities.Notification notification)
    {
        return new NotificationToShowDTO
        {
            Id = notification.Id,
            FoundItemId = notification.FoundItemId,
            NotificationReceiver = notification.NotificationReceiver,
            IsRead = notification.IsRead,
            Details = notification.Details,
            CreatedAt = notification.CreatedAt
        };
    }

}
