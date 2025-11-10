using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using Lost_And_Found_Web_Portal.Core.Domain.IdentityEntities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Infrastructure.DbContext
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
    {
        public ApplicationDbContext(DbContextOptions options)
        : base(options)
        {
        }

        public virtual DbSet<LostItem> LostItems { get; set; }
        public virtual DbSet<FoundItem> FoundItems { get; set; }
        public virtual DbSet<Chat> Chats { get; set; }
        public virtual DbSet<ChatThread> ChatThreads { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<LostItem>().ToTable("LostItems");
            modelBuilder.Entity<FoundItem>().ToTable("FoundItems");
            modelBuilder.Entity<Chat>().ToTable("Chats");
            modelBuilder.Entity<ChatThread>().ToTable("ChatThreads");
        }
    }
}
