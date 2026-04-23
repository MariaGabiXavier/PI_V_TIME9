package com.sched.api.service;

import com.sched.api.dto.request.UserUpdateRequest;
import com.sched.api.dto.response.UserResponse;
import com.sched.api.exception.ResourceNotFoundException;
import com.sched.api.domain.User;
import com.sched.api.repository.UserRepository;
import com.sched.api.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserResponse me() {
        User authUser = SecurityUtils.getAuthenticatedUser();

        User user = userRepository.findByEmail(authUser.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("user not found or inactive"));

        return mapToResponse(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAll() {
        User authUser = SecurityUtils.getAuthenticatedUser();
        return userRepository.findAllByCompanyIdAndDeletedFalse(authUser.getCompany().getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        User authUser = SecurityUtils.getAuthenticatedUser();

        User user = userRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        validateCompanyAccess(authUser, user);

        return mapToResponse(user);
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest dto) {
        User authUser = SecurityUtils.getAuthenticatedUser();

        if (!authUser.getId().equals(id) && !isAdmin(authUser)) {
            throw new AccessDeniedException("Not authorized to update this profile");
        }

        User userToUpdate = userRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        validateCompanyAccess(authUser, userToUpdate);

        userToUpdate.setName(dto.name());
        userToUpdate.setEmail(dto.email());

        return mapToResponse(userRepository.save(userToUpdate));
    }

    @Transactional
    public void delete(Long id) {
        User authUser = SecurityUtils.getAuthenticatedUser();

        User user = userRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        validateCompanyAccess(authUser, user);

        user.setDeleted(true);

        userRepository.save(user);
    }

    private void validateCompanyAccess(User authUser, User targetUser) {
        if (!authUser.getCompany().getId().equals(targetUser.getCompany().getId())) {
            throw new AccessDeniedException("Access denied: different company");
        }
    }

    private boolean isAdmin(User user) {
        return user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private UserResponse mapToResponse(User user) {
        return new UserResponse(user);
    }
}
