using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using Lost_And_Found_Web_Portal.Core.Domain.IdentityEntities;
using Lost_And_Found_Web_Portal.Core.Domain.RepositoryContracts;
using Lost_And_Found_Web_Portal.Core.DTO;
using Lost_And_Found_Web_Portal.Core.Helpers;
using Lost_And_Found_Web_Portal.Core.ServiceContracts;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.Services
{
    public class LostAndFoundService : ILostAndFoundService
    {
        private readonly ILogger<LostAndFoundService> _logger;
        private readonly ILostAndFoundRepository _lostAndFoundRepository;
        private readonly StringMatchHelper _stringMatchHelper;
        private readonly ImageConverter _imageConverter;

        public LostAndFoundService(ILogger<LostAndFoundService> logger, ILostAndFoundRepository lostAndFoundRepository)
        {
            _logger = logger;
            _lostAndFoundRepository = lostAndFoundRepository;
            _stringMatchHelper = new StringMatchHelper();
            _imageConverter = new ImageConverter();
        }

        public async Task<LostItemToShowDTO> AddLostItemAsync(LostItemToAddDTO lostItemToAddDTO, string ownerName, Guid ownerId, string webRootPath)
        {
            LostItemToShowDTO lostItemToShowDTO = new LostItemToShowDTO();

            LostItem lostItem = lostItemToAddDTO.ToLostItemEntity();

            lostItem.OwnerName = ownerName;
            lostItem.OwnerId = ownerId;
            lostItem.PhotoUrl = await _imageConverter.SaveBase64ImageAsync(lostItemToAddDTO.PhotoBase64, lostItem.Id, webRootPath);


            await _lostAndFoundRepository.AddLostItem(lostItem);

            lostItemToShowDTO = lostItem.ToLostItemToShow();
            lostItemToShowDTO.PhotoBase64 = lostItemToAddDTO.PhotoBase64;
            return lostItemToShowDTO;
        }

        public async Task<List<LostItemToShowDTO>> GetAllLostItemx(string webRootPath)
        {
            List<LostItem> lostItems =  _lostAndFoundRepository.GetAllLostItems();
            List<LostItemToShowDTO> lostItemToShowDTOs = lostItems.Select(li => li.ToLostItemToShow()).ToList();

            foreach(LostItemToShowDTO dto in lostItemToShowDTOs)
            {
                dto.PhotoBase64 =await _imageConverter.ConvertImageToBase64Async(dto.PhotoBase64, webRootPath);
            }
            return lostItemToShowDTOs;
        }

        public async Task<List<LostItemToShowDTO>> GetLostItemById(string webRootPath, Guid Id)
        {
            List<LostItem> lostItems = _lostAndFoundRepository.GetLostItemsById(Id);
            List<LostItemToShowDTO> lostItemToShowDTOs = lostItems.Select(li => li.ToLostItemToShow()).ToList();

            foreach (LostItemToShowDTO dto in lostItemToShowDTOs)
            {
                dto.PhotoBase64 = await _imageConverter.ConvertImageToBase64Async(dto.PhotoBase64, webRootPath);
            }
            return lostItemToShowDTOs;
        }
    }
}
