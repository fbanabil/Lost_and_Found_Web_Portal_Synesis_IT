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

        public async Task AddMessage(Message message)
        {
            await _dbContext.Messages.AddAsync(message);
            _dbContext.SaveChanges();
        }

        public async Task<Guid?> AddThread(Threads threads)
        {
            await _dbContext.Threads.AddAsync(threads);
            _dbContext.SaveChanges();
            return threads.ThreadId;
        }

        public async Task AddThreadMember(ThreadMembers threadMembers)
        {
            await _dbContext.ThreadMembers.AddAsync(threadMembers);
            _dbContext.SaveChanges();
        }

        public async Task<Guid?> ExistThread(Guid user1, Guid user2)
        {
            Threads? threadExists = await _dbContext.Threads.Include(t=>t.ThreadMembers)
                .FirstOrDefaultAsync(t => t.ThreadMembers != null &&
                           t.ThreadMembers.Count == 2 &&
                           t.ThreadMembers.Any(tm => tm.UserId == user1) &&
                           t.ThreadMembers.Any(tm => tm.UserId == user2));

            return threadExists?.ThreadId;
        }

        public async Task<List<Message>> GetMessagesByThreadId(Guid threadGuid)
        {
            return await _dbContext.Messages.Where(m=>m.ThreadId==threadGuid).ToListAsync();
        }

        public async Task<List<Threads>?> GetThreadsByUserId(Guid id)
        {
            return await _dbContext.Threads.Include(t=>t.ThreadMembers).Where(t => t.ThreadMembers.Any(tm=>tm.UserId==id)).ToListAsync();
        }

        public async Task<string?> GetUserNameById(Guid id)
        {
            return await _dbContext.Users
                .Where(u => u.Id == id)
                .Select(u => u.PersonName)
                .FirstOrDefaultAsync();
        }

        public async Task LastActivityUpdate(Guid threadId, DateTime presentTime)
        {
            await _dbContext.Database.ExecuteSqlRawAsync(
                "UPDATE [L&D_Web_Portal_Schema].[Threads] SET LastActivity = {0} WHERE ThreadId = {1}",
                presentTime, threadId);
        }
    }
}
