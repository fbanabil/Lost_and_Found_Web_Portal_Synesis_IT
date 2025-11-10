using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using Lost_And_Found_Web_Portal.Core.DTO;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.DTO
{
    public class ThreadToShowDTO
    {
        public Guid ChatThreadId { get; set; }

        [Required]
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
    }
}

public static class ThreadExtension
{
    public static ThreadToShowDTO ToThreadToShowDTO(this ChatThread chatThread)
    {
        return new ThreadToShowDTO()
        {
            ChatThreadId = chatThread.ChatThreadId,
            SenderId = chatThread.SenderId,
            ReceiverId = chatThread.ReceiverId,
            SenderName = chatThread.SenderName,
            ReceiverName = chatThread.ReceiverName,
            CreatedAt = chatThread.CreatedAt,
            LastUpdatedAt = chatThread.LastUpdatedAt
        };
    }
}
