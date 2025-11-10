using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.DTO
{
    public class ChatToAddDTO
    {
        [Required]
        public Guid ThreadId { get; set; }

        [Required]
        public Guid ReceiverId { get; set; }

        public Guid? SenderId { get; set; }

        [MaxLength(1000)]
        public string? Message { get; set; }

        public string? base64String { get; set; }

        public Chat ToChat()
        {
            return new Chat()
            {
                ThreadId = ThreadId,
                Message = Message,
                AttachmentUrl = base64String,
                Id=new Guid(),
                ReceiverId=ReceiverId,
                SenderId= SenderId
            };
        }
    }
}
