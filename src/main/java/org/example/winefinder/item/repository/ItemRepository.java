package org.example.winefinder.item.repository;

import org.example.winefinder.item.entity.Item;
import org.springframework.data.jpa.repository.*;

public interface ItemRepository extends JpaRepository<Item, Long>, JpaSpecificationExecutor<Item> {
}
