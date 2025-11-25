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

        public virtual DbSet<Notification> Notifications { get; set; }


        public virtual DbSet<Threads> Threads { get; set; }
        public virtual DbSet<ThreadMembers> ThreadMembers { get; set; }
        public virtual DbSet<Message> Messages { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema("L&D_Web_Portal_Schema");

            modelBuilder.Entity<LostItem>().ToTable("LostItems");
            modelBuilder.Entity<FoundItem>().ToTable("FoundItems");
            modelBuilder.Entity<Notification>().ToTable("Notifications");
            modelBuilder.Entity<Threads>().ToTable("Threads");
            modelBuilder.Entity<ThreadMembers>().ToTable("ThreadMembers");
            modelBuilder.Entity<Message>().ToTable("Messages");


            modelBuilder.Entity<LostItem>()
                .HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(li => li.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<FoundItem>()
                .HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(fi => fi.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notification>()
                .HasOne<FoundItem>()
                .WithMany()
                .HasForeignKey(n => n.FoundItemId)
                .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<Notification>()
                .HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(n => n.NotificationReceiver)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<ThreadMembers>()
                .HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(tm => tm.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<Message>()
                .HasOne<Threads>()
                .WithMany()
                .HasForeignKey(m => m.ThreadId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

        }
    }
}
