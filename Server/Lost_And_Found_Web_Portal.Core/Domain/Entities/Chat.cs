using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.Domain.Entities
{
    public class Chat
    {
        [Required]
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid ThreadId { get; set; }


        [Required]
        public Guid? SenderId { get; set; }

        [Required]
        public Guid? ReceiverId { get; set; }

        [MaxLength(1000)]
        public string? Message { get; set; }

        public string? AttachmentUrl { get; set; }

    }
}
