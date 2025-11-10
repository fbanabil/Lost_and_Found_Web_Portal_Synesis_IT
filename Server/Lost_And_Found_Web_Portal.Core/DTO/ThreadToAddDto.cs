using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.DTO
{
    public class ThreadToAddDto
    {
        public Guid SenderId { get; set; }

        [Required]
        public Guid ReceiverId { get; set; }

        [Required]
        public string? SenderName { get; set; }

        [Required]
        public string? ReceiverName { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime LastUpdatedAt { get; set; }

        public ChatThread ToChatThread()
        {
            return new ChatThread()
            {
                ChatThreadId = new Guid(),
                SenderId = SenderId,
                ReceiverId = ReceiverId,
                SenderName = SenderName,
                ReceiverName = ReceiverName,
                CreatedAt = DateTime.UtcNow,
                LastUpdatedAt = DateTime.UtcNow
            };
        }
    }
}
