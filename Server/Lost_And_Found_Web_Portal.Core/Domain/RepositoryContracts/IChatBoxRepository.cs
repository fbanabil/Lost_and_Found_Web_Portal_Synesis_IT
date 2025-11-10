using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using Lost_And_Found_Web_Portal.Core.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.Domain.RepositoryContracts
{
    public interface IChatBoxRepository
    {
        public Task AddChat(Chat chat);
        public Task AddChatThread(ChatThread chatThread);
        public Task<List<Chat>> GetChatByThreadId(Guid threadId);
        public Task<List<ChatThread>> GetChatThreads(Guid receiverId, Guid userId);
        public Task<List<ChatThread>> GetSortedThreadsById(Guid id);
    }
}
