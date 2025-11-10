using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using Lost_And_Found_Web_Portal.Core.Domain.RepositoryContracts;
using Lost_And_Found_Web_Portal.Core.DTO;
using Lost_And_Found_Web_Portal.Core.Helpers;
using Lost_And_Found_Web_Portal.Core.ServiceContracts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.Services
{
    public class ChatBoxServices : IChatBoxServices
    {
        private readonly IChatBoxRepository _chatBoxRepository;
        private readonly ImageConverter _imageConverter;
        public ChatBoxServices(IChatBoxRepository chatBoxRepository)
        {
            _chatBoxRepository = chatBoxRepository;
            _imageConverter = new ImageConverter();
        }

        public async Task<ChatToShowDTO> AddChat(ChatToAddDTO chatToAddDTO, string webRootPath)
        {
            Chat chat = chatToAddDTO.ToChat();

            if(chatToAddDTO.base64String!=null) chat.AttachmentUrl =await _imageConverter.SaveBase64ChatImageAsync(chatToAddDTO.base64String, chat.Id,webRootPath);

            await _chatBoxRepository.AddChat(chat);

            ChatToShowDTO chatToShowDTO = chat.ToChatToShowDTO();
            chatToShowDTO.base64string = chatToAddDTO.base64String;

            return chatToShowDTO;

        }

        public async Task<bool> ExistThread(Guid receiverId,Guid userId)
        {
            List<ChatThread> chatThreads = await _chatBoxRepository.GetChatThreads(receiverId,userId);

            if (chatThreads.Count == 0) return false;

            return true;
        }

        public async Task<List<ChatToShowDTO>> GetChatByThreadId(Guid threadId,string webRootPath)
        {
            List<Chat> chats =  await _chatBoxRepository.GetChatByThreadId(threadId);
         
            List<ChatToShowDTO> chatToShowDTOs = chats.Select(x => x.ToChatToShowDTO()).ToList();

            foreach(ChatToShowDTO dt in chatToShowDTOs)
            {
                if(dt.base64string!=null) dt.base64string = await _imageConverter.ConvertImageToBase64Async(dt.base64string,webRootPath);
            }

            return chatToShowDTOs;

        }

        public async Task<List<ThreadToShowDTO>> GetSortedThreadsByUserId(Guid id)
        {
            List<ChatThread> threads = await _chatBoxRepository.GetSortedThreadsById(id);
            List<ThreadToShowDTO> threadToShowDTOs = threads.Select(x => x.ToThreadToShowDTO()).ToList();

            foreach (ThreadToShowDTO dt in threadToShowDTOs)
            {
                if (dt.ReceiverId == id)
                {
                    Guid temp = dt.ReceiverId;
                    dt.ReceiverId = dt.SenderId;
                    dt.SenderId = temp;

                    string? temps = dt.ReceiverName;
                    dt.ReceiverName = dt.SenderName;
                    dt.SenderName = temps;
                }
            }

            return threadToShowDTOs;
        }

        public async Task<ThreadToShowDTO> InitiateThread(ThreadToAddDto threadToAddDto)
        {
            ChatThread chatThread = threadToAddDto.ToChatThread();

            await _chatBoxRepository.AddChatThread(chatThread);

            ThreadToShowDTO threadToShowDTO = chatThread.ToThreadToShowDTO();

            return threadToShowDTO;
        }
    }
}
