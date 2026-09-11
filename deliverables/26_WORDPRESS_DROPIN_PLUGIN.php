<?php
/**
 * Plugin Name: Belgin AI Search & GEO Engine Drop-in
 * Description: Sub-14KB AST pruning and LLMS meta discovery for WordPress
 * Version: 3.0.0
 */
add_action("wp_head", function() {
    echo '<link rel="describedby" href="https://www.belginkuyumculuk.com/llms.txt">' . "\n";
    echo '<link rel="alternate" type="text/markdown" href="https://www.belginkuyumculuk.com/index.md">' . "\n";
});
