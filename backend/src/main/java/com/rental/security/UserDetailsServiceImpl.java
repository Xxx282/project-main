package com.rental.security;

import com.rental.modules.user.entity.UserEntity;
import com.rental.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Spring Security UserDetailsService 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        // 先按用户名查找，再按邮箱查找
        UserEntity userEntity = userRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> userRepository.findByEmail(usernameOrEmail)
                        .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + usernameOrEmail)));

        if (!userEntity.getIsActive()) {
            throw new UsernameNotFoundException("用户已被禁用: " + usernameOrEmail);
        }

        log.debug("加载用户详情成功: username={}, role={}", userEntity.getUsername(), userEntity.getRole());

        return User.builder()
                .username(userEntity.getUsername())
                .password(userEntity.getPassword())
                .authorities(Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + userEntity.getRole().name())))
                .disabled(!userEntity.getIsActive())
                .build();
    }

    /**
     * 根据用户 ID 加载用户
     */
    public UserDetails loadUserById(Long id) throws UsernameNotFoundException {
        UserEntity userEntity = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + id));

        return User.builder()
                .username(userEntity.getUsername())
                .password(userEntity.getPassword())
                .authorities(Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + userEntity.getRole().name())))
                .disabled(!userEntity.getIsActive())
                .build();
    }
}
