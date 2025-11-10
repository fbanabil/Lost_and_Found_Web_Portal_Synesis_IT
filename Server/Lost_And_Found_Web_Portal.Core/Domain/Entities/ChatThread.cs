using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.Domain.Entities
{
    public class ChatThread
    {
        [Key]
        [Required]
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
