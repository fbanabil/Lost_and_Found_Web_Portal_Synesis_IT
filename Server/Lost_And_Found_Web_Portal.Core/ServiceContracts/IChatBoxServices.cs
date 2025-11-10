using Lost_And_Found_Web_Portal.Core.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.ServiceContracts
{
    public interface IChatBoxServices
    {
        public Task<ChatToShowDTO> AddChat(ChatToAddDTO chatToAddDTO, string webRootPath);
        public Task<bool> ExistThread(Guid receiverId,Guid userId);
        public Task<List<ChatToShowDTO>> GetChatByThreadId(Guid threadId,string webRootPath);
        public Task<List<ThreadToShowDTO>> GetSortedThreadsByUserId(Guid id);
        public Task<ThreadToShowDTO> InitiateThread(ThreadToAddDto threadToAddDto);
    }
}
