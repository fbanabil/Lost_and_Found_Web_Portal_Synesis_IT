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
    public class ChatToShowDTO
    {
        public Guid Id { get; set; }
        public Guid ThreadId { get; set; }

        public Guid? SenderId { get; set; }
        public Guid? ReceiverId { get; set; }

        public string? Message { get; set; }

        public string? base64string { get; set; }
    }
}

public static class ChatExtension
{
    public static ChatToShowDTO ToChatToShowDTO(this Chat chat)
    {
        return new ChatToShowDTO()
        {
            Id = chat.Id,
            Message = chat.Message,
            ThreadId=chat.ThreadId,
            base64string=chat.AttachmentUrl,
            SenderId=chat.SenderId,
            ReceiverId=chat.ReceiverId
        };
    }

}


