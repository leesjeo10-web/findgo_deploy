package org.example.winefinder.item.repository;

import org.example.winefinder.item.entity.Item;
import org.springframework.data.jpa.repository.*;

public interface ItemRepository extends JpaRepository<Item, Long>, JpaSpecificationExecutor<Item> {
    boolean existsByImageUrl(String imageUrl);
    void deleteByUserId(Long userId);

    // [userId, 물품 수] 목록. 관리자 학생 목록의 물품 수에 씁니다.
    @Query("select i.userId, count(i) from Item i group by i.userId")
    java.util.List<Object[]> countGroupByUserId();
}
