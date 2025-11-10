using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using Lost_And_Found_Web_Portal.Core.Domain.RepositoryContracts;
using Lost_And_Found_Web_Portal.Core.DTO;
using Lost_And_Found_Web_Portal.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Infrastructure.Repositories
{
    public class ChatBoxRepository : IChatBoxRepository
    {
        private readonly ApplicationDbContext _dbContext;
        public ChatBoxRepository(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task AddChat(Chat chat)
        {
            await _dbContext.Chats.AddAsync(chat);
            _dbContext.SaveChanges();
        }

        public async Task AddChatThread(ChatThread chatThread)
        {
            await _dbContext.ChatThreads.AddAsync(chatThread);
            _dbContext.SaveChanges();
        }

        public async Task<List<Chat>> GetChatByThreadId(Guid threadId)
        {
            return await _dbContext.Chats.Where(x => x.ThreadId == threadId).ToListAsync();
        }
        //public async Task<List<Chat>> GetChatByThreadId(Guid threadId)
        //{
        //    return _dbContext.Chats.Where(x=>x.ThreadId == threadId).ToList();
        //}

        public async Task<List<ChatThread>> GetChatThreads(Guid receiverId, Guid userId)
        {
            List<ChatThread> threads = await _dbContext.ChatThreads.ToListAsync();
            List<ChatThread> filteredThreads = new List<ChatThread>();
            foreach (ChatThread chatThread in threads)
            {
                if ((chatThread.ReceiverId == receiverId && chatThread.SenderId == userId) ||
                    (chatThread.ReceiverId == userId && chatThread.SenderId == receiverId))
                {
                    filteredThreads.Add(chatThread);
                }
            }
            return filteredThreads;
        }

        public async Task<List<ChatThread>> GetSortedThreadsById(Guid id)
        {
            return _dbContext.ChatThreads.Where(x=>x.SenderId==id || x.ReceiverId==id)
                .OrderByDescending(x=>x.LastUpdatedAt)
                .ToList();
        }
    }
}
